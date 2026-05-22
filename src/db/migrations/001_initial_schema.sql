CREATE TABLE IF NOT EXISTS scheduled_messages (

    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    contactName TEXT,
    message TEXT NOT NULL,
    scheduledAt TEXT NOT NULL,
    status TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    sentAt TEXT,
    deliveredAt TEXT,
    ackLevel INTEGER,
    retryCount INTEGER DEFAULT 0,
    notifiedAt TEXT,
    failReason TEXT,
    whatsappMessageId TEXT,
    lastRestryAt TEXT,
    deliveryTimeoutAt TEXT,
    updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY
    name TEXT NOT NULL
    phone TEXT NOT NULL UNIQUE
    tags TEXT
    priority TEXT DEFAULT 'normal'
    lastInteraction TEXT
);

CREATE TABLE IF NOT EXISTS email_logs (
    id TEXT PRIMARY KEY
    messageId TEXT
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL
    type TEXT,
    status TEXT NOT NULL
    sentAt TEXT,
    success INTEGER
    error TEXT,
    errorMessage TEXT
    createdAt TEXT NOT NULL
    FOREIGN KEY (messageId)
    REFERENCES scheduled_messages(id)
);