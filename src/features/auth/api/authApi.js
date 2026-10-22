import client from '../../../api/axiosClient';

export const registerUser = (payload) => client.post('/register', payload).then((r) => r.data);
export const loginUser = (payload) => client.post('/login', payload).then((r) => r.data);
export const logoutUser = () => client.post('/logout').then((r) => r.data);
export const fetchMe = () => client.get('/me').then((r) => r.data.user);
export const updatePreferredLanguage = (preferred_language) =>
  client.patch('/me/language', { preferred_language }).then((r) => r.data);
