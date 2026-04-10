import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://acmqkbjztboleukguoel.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjZiNDBlMGEzLWIwZTgtNDQ0Zi1iMjU4LWM0ZWViZGMyNmEzOCJ9.eyJwcm9qZWN0SWQiOiJhY21xa2JqenRib2xldWtndW9lbCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc0OTc4OTgzLCJleHAiOjIwOTAzMzg5ODMsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.oslQMgfKeitgaLjLcNn-_g3iRNt3fYPFXRViIHv6IkM';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };