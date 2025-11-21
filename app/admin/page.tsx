import Link from 'next/link';

export default function AdminHomePage() {
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
            marginBottom: 32,
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

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20
          }}
        >
          {/* Constructor / Settings */}
          <Link
            href="/admin/settings"
            style={{
              display: 'block',
              padding: 20,
              borderRadius: 16,
              border: '1px solid #1f2937',
              background:
                'radial-gradient(circle at top left, #0ea5e9 0, #020617 55%, #020617 100%)',
              textDecoration: 'none',
              color: '#e5e7eb',
              boxShadow: '0 20px 40px rgba(15,23,42,0.8)'
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Javob konstruktori
            </h2>
            <p style={{ fontSize: 14, color: '#cbd5f5' }}>
              Botning barcha xabarlari: birinchi salomlashish, telefon so‘rash,
              kasb so‘rash va yakuniy xabar matnlarini o‘zgartirish.
            </p>
            <p
              style={{
                marginTop: 12,
                fontSize: 12,
                opacity: 0.9
              }}
            >
              ➜ Foydalanuvchidan ism/telefon/kasb so‘rashni yoqish/o‘chirish
              ham shu yerda.
            </p>
          </Link>

          {/* Bulk & Users */}
          <Link
            href="/admin/bulk"
            style={{
              display: 'block',
              padding: 20,
              borderRadius: 16,
              border: '1px solid #1f2937',
              background:
                'radial-gradient(circle at top right, #22c55e 0, #020617 55%, #020617 100%)',
              textDecoration: 'none',
              color: '#e5e7eb',
              boxShadow: '0 20px 40px rgba(15,23,42,0.8)'
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Foydalanuvchilar & bulk xabar
            </h2>
            <p style={{ fontSize: 14, color: '#cbd5f5' }}>
              Botga yozganlar ro‘yxati, tanlab turib odatiy text xabar yuborish
              va kerak bo‘lsa CSV export.
            </p>
            <p
              style={{
                marginTop: 12,
                fontSize: 12,
                opacity: 0.9
              }}
            >
              ➜ Admin sifatida Telegram ichidan forwarding orqali hamma
              foydalanuvchilarga media yuborish funksiyasi o‘zgarmaydi.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
