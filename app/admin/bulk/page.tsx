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

export default function AdminBulkPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [broadcastText, setBroadcastText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

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
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>
              Foydalanuvchilar & Bulk xabar
            </h1>
            <p
              style={{
                fontSize: 13,
                color: '#9ca3af',
                marginTop: 4
              }}
            >
              Botga yozganlarning ro‘yxati va tanlab turib text xabar yuborish.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <a
              href="/api/admin/export"
              style={{
                padding: '8px 14px',
                borderRadius: 9999,
                border: '1px solid #38bdf8',
                textDecoration: 'none',
                fontSize: 13
              }}
            >
              Export CSV
            </a>
            <a
              href="/admin"
              style={{
                padding: '8px 14px',
                borderRadius: 9999,
                border: '1px solid #4b5563',
                textDecoration: 'none',
                fontSize: 13
              }}
            >
              ← Asosiy admin sahifa
            </a>
          </div>
        </header>

        <section
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid #1f2937',
            background: '#020617'
          }}
        >
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
                  maxHeight: 450,
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
