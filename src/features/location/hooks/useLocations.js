import { useEffect, useState } from 'react';
import { fetchDistricts, fetchThanas } from '../api/locationApi';
import { useLanguage } from '../../../i18n/LanguageContext';

/**
 * District + Thana (PS) dropdown data.
 * Thanas are loaded again every time the selected district changes.
 */
export function useLocations(districtId) {
  const [districts, setDistricts] = useState([]);
  const [thanas, setThanas] = useState([]);
  const [loadingThanas, setLoadingThanas] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    fetchDistricts()
      .then(setDistricts)
      .catch(() => {
        setDistricts([]);
        setError(t('locationError'));
      });
  }, [t]);

  useEffect(() => {
    if (!districtId) {
      setThanas([]);
      return;
    }
    setLoadingThanas(true);
    setError('');
    fetchThanas(districtId)
      .then(setThanas)
      .catch(() => {
        setThanas([]);
        setError(t('locationError'));
      })
      .finally(() => setLoadingThanas(false));
  }, [districtId, t]);

  return { districts, thanas, loadingThanas, error };
}
