(async () => {
  const base = "https://back-0o27.onrender.com";
  const token = "PEGA_AQUI_TU_TOKEN"; // o déjalo como lo tomas del localStorage

  const paths = ["/orders/me", "/api/orders/me"];
  for (const p of paths) {
    const r = await fetch(base + p, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(p, r.status);
    console.log(await r.text());
  }
})();
