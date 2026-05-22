ALTER TABLE scheduled_messages ADD COLUMN lastRestryAt TEXT;
ALTER TABLE scheduled_messages ADD COLUMN deliveryTimeoutAt TEXT;
ALTER TABLE scheduled_messages ADD COLUMN updatedAt TEXT;