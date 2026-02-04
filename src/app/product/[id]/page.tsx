export default function Page({ params }: { params: any }) {
  return (
    <div style={{ padding: 20 }}>
      <h1>DEBUG PARAMS</h1>
      <pre>{JSON.stringify(params, null, 2)}</pre>
    </div>
  );
}
