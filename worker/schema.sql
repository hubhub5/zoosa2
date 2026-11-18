-- npx wrangler d1 execute zoosa2-paid --remote --file=schema.sql
CREATE TABLE IF NOT EXISTS paid (
  ref TEXT PRIMARY KEY,          -- 사이트가 만든 랜덤 참조값 (zs_...)
  uid TEXT,                      -- 그로블 merchantUid (환불 알림 매칭용)
  phone TEXT,                    -- 휴대폰 번호 해시 (원문 아님)
  email TEXT,                    -- 메일 해시 (원문 아님)
  rid TEXT,                      -- 처음 연 리포트의 입력값 해시 (결제 1건 = 리포트 1개)
  at TEXT,
  refunded INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS paid_uid ON paid(uid);
CREATE INDEX IF NOT EXISTS paid_phone ON paid(phone);
CREATE INDEX IF NOT EXISTS paid_email ON paid(email);
CREATE TABLE IF NOT EXISTS shapes (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT, body TEXT);
