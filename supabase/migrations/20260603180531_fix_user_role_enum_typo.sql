-- Oprava překlepu v enumu user_role: 'pronajimatell' → 'pronajimatel'
-- Tato migrace byla aplikována na remote DB jako první oprava.
alter type user_role rename value 'pronajimatell' to 'pronajimatel';
