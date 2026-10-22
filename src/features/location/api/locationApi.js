import client from '../../../api/axiosClient';

export const fetchDistricts = () => client.get('/districts').then((r) => r.data);
export const fetchThanas = (districtId) =>
  client.get(`/districts/${districtId}/thanas`).then((r) => r.data);
