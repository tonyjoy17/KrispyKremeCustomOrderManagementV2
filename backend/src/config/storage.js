const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('./database');

const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'order-images';

const objectPathFromValue = (value) => {
  if (!value) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = value.indexOf(marker);
  return index >= 0 ? decodeURIComponent(value.slice(index + marker.length)) : value;
};

const uploadOrderImage = async (file, storeId) => {
  if (!file) return null;
  const objectPath = `${storeId}/${uuidv4()}${path.extname(file.originalname).toLowerCase()}`;
  const { error } = await supabase.storage.from(bucket).upload(objectPath, file.buffer, {
    contentType: file.mimetype, upsert: false,
  });
  if (error) throw error;
  return objectPath;
};

const removeOrderImages = async (values) => {
  const paths = values.map(objectPathFromValue).filter(Boolean);
  if (!paths.length) return;
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw error;
};

const getSignedImageUrl = async (value) => {
  const objectPath = objectPathFromValue(value);
  if (!objectPath) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 3600);
  if (error) throw error;
  return data.signedUrl;
};

module.exports = { uploadOrderImage, removeOrderImages, getSignedImageUrl };
