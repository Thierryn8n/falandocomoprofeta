-- Migration: Add prophet_message card type to study_cards
-- Description: Add new card type for prophet messages

ALTER TABLE study_cards 
ADD CONSTRAINT check_card_type_prophet 
CHECK (card_type IN ('verse', 'concept', 'question', 'answer', 'connection', 'note', 'prophet_message'));

-- Update existing cards if needed (optional)
-- This will be handled automatically by the constraint
