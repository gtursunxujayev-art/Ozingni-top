'use client';

import { useEffect, useState } from 'react';

type BotSettings = {
  greetingText: string;
  askPhoneText: string;
  askJobText: string;
  finalMessage: string;
  questionsEnabled: boolean;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
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
      setSaving(false);
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
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
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
              Javob konstruktori
            </h1>
            <p
              style={{
                fontSize: 13,
                color: '#9ca3af',
                marginTop: 4
              }}
            >
              Bot foydalanuvchiga yuboradigan xabarlar matnini shu yerda
              boshqarasiz.
            </p>
          </div>

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
        </header>

        <section
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid #1f2937',
            background: '#020617'
          }}
        >
          {loading && <p>Sozlamalar yuklanmoqda...</p>}

          {!loading && settings && (
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
                    Foydalanuvchidan <b>ism / telefon / kasb</b> so‘rashni
                    yoqish / o‘chirish
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
                  username va Telegram ID sini bazaga yozib qo‘yadi va yakuniy
                  xabarni yuboradi.
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
                onClick={handleSave}
                disabled={saving}
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
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Saqlanmoqda...' : 'Sozlamalarni saqlash'}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
