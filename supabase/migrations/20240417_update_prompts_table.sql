-- Rename columns in prompts table
ALTER TABLE ai.prompts RENAME COLUMN input_order TO prompt_order;
ALTER TABLE ai.prompts RENAME COLUMN input_description TO prompt_text;
ALTER TABLE ai.prompts DROP COLUMN input_name;
ALTER TABLE ai.prompts DROP COLUMN is_required; 