const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(cors());
app.use(express.json());

app.post('/cards', async (req, res) => {
  const { error } = await supabase.from('cards').insert(req.body);
  if (error) return res.status(400).json(error);
  res.status(201).json({ message: 'Card created successfully' });
});

app.get('/cards', async (req, res) => {
  const { data, error } = await supabase.from('cards').select('*');
  if (error) return res.status(400).json(error);
  res.status(200).json(data);
});

app.patch('/cards/:id', async (req, res) => {
  const id = req.params.id;
  const { data, error } = await supabase.from('cards').update(req.body).eq('id', id);
  if (error) return res.status(400).json(error);
  res.status(200).json(data);
});

app.delete('/cards/:id', async (req, res) => {
  const id = req.params.id;
  const { error } = await supabase.from('cards').delete().eq('id', id);
  if (error) return res.status(400).json(error);
  res.status(200).json({ message: 'Card deleted successfully' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
