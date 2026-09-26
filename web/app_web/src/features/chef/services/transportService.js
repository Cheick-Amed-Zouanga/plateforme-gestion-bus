import apiFetch from '../../../shared/services/api';

export const getBus       = ()        => apiFetch('/transport/bus/');
export const creerBus     = (payload) => apiFetch('/transport/bus/',     { method: 'POST', body: JSON.stringify(payload) });

export const getLignes    = ()        => apiFetch('/transport/lignes/');

export const getHoraires  = ()        => apiFetch('/transport/horaires/');
export const creerHoraire = (payload) => apiFetch('/transport/horaires/', { method: 'POST', body: JSON.stringify(payload) });
export const genererHoraire = (id, jours_avant = 14) =>
  apiFetch(`/transport/horaires/${id}/generer/`, {
    method: 'POST',
    body: JSON.stringify({ jours_avant }),
  });

export const getTrajets   = ()        => apiFetch('/transport/trajets/');
export const creerTrajet  = (payload) => apiFetch('/transport/trajets/', { method: 'POST', body: JSON.stringify(payload) });

export const getTarifs    = ()        => apiFetch('/transport/tarifs/');
export const creerTarif   = (payload) => apiFetch('/transport/tarifs/',  { method: 'POST', body: JSON.stringify(payload) });
