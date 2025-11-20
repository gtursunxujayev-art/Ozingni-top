'use client';

import { useEffect, useState } from 'react';

type User = {
  id: number;
  name: string;
  username: string | null;
  phone: string;
  job: string;
  createdAt: string;
};

type BotSettings = {
  greetingText: string;
  askPhoneText: string;
  askJobText: string;
  finalMessage: string;
  questionsEnabled: boolean;
};

export default function AdminPage() {
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [broadcastText, setBroadcastText] = useState('');

  // Load settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (!res.ok) throw new Error('Failed to load settings');
        const raw = await res.json();
        const data: BotSettings = {
          greetingText: raw.greetingText ?? '',
          askPhoneText: raw.askPhoneText ?? '',
          askJobText: raw.askJobText ?? '',
          finalMessage: raw.finalMessage ?? '',
          questionsEnabled:
            typeof raw.questionsEnabled === 'boolean'
              ? raw.questionsEnabled
              : true
        };
        setSettings(data);
      } catch (err) {
        console.error(err);
        alert('Bot sozlamalarini yuklashda xatolik.');
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  // Load users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users');
        if (!res.ok) throw new Error('Failed to load users');
        const data: User[] = await res.json();
        setUsers(data);
      } catch (err) {
        console.error(err);
        alert('Foydalanuvchilar roʻyxatini yuklashda xatolik.');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error('Failed to save');
      const updated = await res.json();
      setSettings(updated);
      alert('Sozlamalar saqlandi.');
    } catch (err) {
      console.error(err);
      alert('Sozlamalarni saqlashda xatolik.');
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleUserSelected = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u.id));
    }
  };

  const handleSendToSelected = async () => {
    if (!broadcastText.trim()) {
      alert('Avval xabar matnini kiriting.');
      return;
    }
    if (selectedIds.length === 0) {
      alert('Hech bo‘lmasa bitta foydalanuvchini tanlang.');
      return;
    }

    setSendingMessage(true);
    try {
      const res = await fetch('/api/admin/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedIds,
          text: broadcastText.trim()
        })
      });
      if (!res.ok) throw new Error('Failed to send');
      const data = await res.json();
      alert(`Xabar yuborildi. Jonatilganlar soni: ${data.sent ?? 0}`);
      setBroadcastText('');
    } catch (err) {
      console.error(err);
      alert('Xabar yuborishda xatolik.');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#020617',
        color: '#e5e7eb',
        padding: '24px'
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <header
          style={{
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>
            Najot Nur – Telegram Bot Admin
          </h1>
          <a
            href="/api/admin/export"
            style={{
              padding: '8px 14px',
              borderRadius: 9999,
              border: '1px solid #38bdf8',
              textDecoration: 'none',
              fontSize: 14
            }}
          >
            Export CSV
          </a>
        </header>

        {/* Settings */}
        <section
          style={{
            marginBottom: 24,
            padding: 16,
            borderRadius: 12,
            border: '1px solid #1f2937',
            background: '#020617'
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
            Bot xabarlari
          </h2>

          {loadingSettings && <p>Sozlamalar yuklanmoqda...</p>}

          {!loadingSettings && settings && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Toggle questions */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  marginBottom: 4
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14
                  }}
                >
                  <input
                    type="checkbox"
                    checked={settings.questionsEnabled}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev
                          ? { ...prev, questionsEnabled: e.target.checked }
                          : prev
                      )
                    }
                  />
                  <span>
                    Foydalanuvchidan{' '}
                    <b>ism / telefon / kasb</b> so‘rashni yoqish / o‘chirish
                  </span>
                </label>
                <p
                  style={{
                    fontSize: 12,
                    color: '#9ca3af',
                    marginLeft: 24
                  }}
                >
                  Agar o‘chirilsa, bot savollar bermaydi – faqat foydalanuvchi
                  username va Telegram ID sini bazaga yozib qo‘yadi.
                </p>
              </div>

              <label style={{ fontSize: 14 }}>
                1. Birinchi xabar (ism so‘rash)
                <textarea
                  style={{
                    marginTop: 4,
                    width: '100%',
                    minHeight: 60,
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #1f2937',
                    background: '#020617',
                    color: '#e5e7eb',
                    fontSize: 14
                  }}
                  value={settings.greetingText}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev ? { ...prev, greetingText: e.target.value } : prev
                    )
                  }
                />
              </label>

              <label style={{ fontSize: 14 }}>
                2. Telefon raqamini so‘rash xabari
                <textarea
                  style={{
                    marginTop: 4,
                    width: '100%',
                    minHeight: 60,
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #1f2937',
                    background: '#020617',
                    color: '#e5e7eb',
                    fontSize: 14
                  }}
                  value={settings.askPhoneText}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev ? { ...prev, askPhoneText: e.target.value } : prev
                    )
                  }
                />
              </label>

              <label style={{ fontSize: 14 }}>
                3. Kasbini so‘rash xabari
                <textarea
                  style={{
                    marginTop: 4,
                    width: '100%',
                    minHeight: 60,
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #1f2937',
                    background: '#020617',
                    color: '#e5e7eb',
                    fontSize: 14
                  }}
                  value={settings.askJobText}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev ? { ...prev, askJobText: e.target.value } : prev
                    )
                  }
                />
              </label>

              <label style={{ fontSize: 14 }}>
                4. Oxirgi xabar
                <textarea
                  style={{
                    marginTop: 4,
                    width: '100%',
                    minHeight: 60,
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #1f2937',
                    background: '#020617',
                    color: '#e5e7eb',
                    fontSize: 14
                  }}
                  value={settings.finalMessage}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev ? { ...prev, finalMessage: e.target.value } : prev
                    )
                  }
                />
              </label>

              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                style={{
                  alignSelf: 'flex-start',
                  marginTop: 4,
                  padding: '8px 16px',
                  borderRadius: 9999,
                  border: 'none',
                  background: '#22c55e',
                  color: '#020617',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  opacity: savingSettings ? 0.7 : 1
                }}
              >
                {savingSettings ? 'Saqlanmoqda...' : 'Sozlamalarni saqlash'}
              </button>
            </div>
          )}
        </section>

        {/* Users & targeted broadcast */}
        <section
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid #1f2937',
            background: '#020617'
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
            Foydalanuvchilar
          </h2>

          {loadingUsers && <p>Foydalanuvchilar yuklanmoqda...</p>}

          {!loadingUsers && (
            <>
              <div
                style={{
                  marginBottom: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12
                  }}
                >
                  <span style={{ fontSize: 14 }}>
                    Tanlangan: {selectedIds.length} / {users.length}
                  </span>
                  <button
                    onClick={handleSelectAll}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 9999,
                      border: '1px solid #4b5563',
                      background: 'transparent',
                      color: '#e5e7eb',
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    {selectedIds.length === users.length
                      ? 'Hammasini bekor qilish'
                      : 'Hammasini tanlash'}
                  </button>
                </div>

                <label style={{ fontSize: 14 }}>
                  Tanlangan foydalanuvchilarga xabar
                  <textarea
                    style={{
                      marginTop: 4,
                      width: '100%',
                      minHeight: 60,
                      padding: 8,
                      borderRadius: 8,
                      border: '1px solid #1f2937',
                      background: '#020617',
                      color: '#e5e7eb',
                      fontSize: 14
                    }}
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="Write message for selected users..."
                  />
                </label>

                <button
                  onClick={handleSendToSelected}
                  disabled={sendingMessage}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '8px 16px',
                    borderRadius: 9999,
                    border: 'none',
                    background: '#3b82f6',
                    color: '#020617',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    opacity: sendingMessage ? 0.7 : 1
                  }}
                >
                  {sendingMessage
                    ? 'Yuborilmoqda...'
                    : 'Tanlanganlarga xabar yuborish'}
                </button>
              </div>

              <div
                style={{
                  maxHeight: 400,
                  overflow: 'auto',
                  borderRadius: 8,
                  border: '1px solid #1f2937'
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 13
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: '#020617',
                        position: 'sticky',
                        top: 0
                      }}
                    >
                      <th
                        style={{
                          padding: 8,
                          borderBottom: '1px solid #1f2937',
                          textAlign: 'left'
                        }}
                      >
                        Tanlash
                      </th>
                      <th
                        style={{
                          padding: 8,
                          borderBottom: '1px solid #1f2937',
                          textAlign: 'left'
                        }}
                      >
                        Ism
                      </th>
                      <th
                        style={{
                          padding: 8,
                          borderBottom: '1px solid #1f2937',
                          textAlign: 'left'
                        }}
                      >
                        Username
                      </th>
                      <th
                        style={{
                          padding: 8,
                          borderBottom: '1px solid #1f2937',
                          textAlign: 'left'
                        }}
                      >
                        Telefon
                      </th>
                      <th
                        style={{
                          padding: 8,
                          borderBottom: '1px solid #1f2937',
                          textAlign: 'left'
                        }}
                      >
                        Kasb
                      </th>
                      <th
                        style={{
                          padding: 8,
                          borderBottom: '1px solid #1f2937',
                          textAlign: 'left'
                        }}
                      >
                        Sana
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: '1px solid #0f172a',
                          background: selectedIds.includes(u.id)
                            ? '#020617'
                            : 'transparent'
                        }}
                      >
                        <td style={{ padding: 8 }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(u.id)}
                            onChange={() => toggleUserSelected(u.id)}
                          />
                        </td>
                        <td style={{ padding: 8 }}>{u.name}</td>
                        <td style={{ padding: 8 }}>
                          {u.username ? `@${u.username}` : ''}
                        </td>
                        <td style={{ padding: 8 }}>{u.phone}</td>
                        <td style={{ padding: 8 }}>{u.job}</td>
                        <td style={{ padding: 8 }}>
                          {new Date(u.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
