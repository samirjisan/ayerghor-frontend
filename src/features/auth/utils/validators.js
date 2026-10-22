// Same rules as Laravel RegisterRequest, so users see errors before the request is sent.

export const MOBILE_REGEX = /^01[3-9][0-9]{8}$/;

export function validateLogin(v, t) {
  const e = {};
  if (!v.mobile.trim()) e.mobile = t('mobileRequired');
  if (!v.password) e.password = t('passwordRequired');
  return e;
}

export function validateRegister(v, t) {
  const e = {};

  if (!v.name.trim()) e.name = t('nameRequired');

  if (!v.mobile.trim()) e.mobile = t('mobileRequired');
  else if (!MOBILE_REGEX.test(v.mobile.trim())) e.mobile = t('mobileInvalid');

  if (!v.village_holding.trim()) e.village_holding = t('villageRequired');
  if (!v.post_office_area.trim()) e.post_office_area = t('postOfficeRequired');
  if (!v.district_id) e.district_id = t('districtRequired');
  if (!v.thana_id) e.thana_id = t('thanaRequired');

  if (!v.password) e.password = t('passwordRequired');
  else if (v.password.length < 8) e.password = t('passwordTooShort');

  if (v.email && !/^\S+@\S+\.\S+$/.test(v.email)) e.email = t('emailInvalid');

  return e;
}
