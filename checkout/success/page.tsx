export default function SuccessPage() {
  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16, color: "white" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Payment successful ✅</h1>
      <p style={{ opacity: 0.85 }}>
        Thanks! You’ll receive a confirmation email from Stripe.
      </p>
      <a href="/" style={{ display: "inline-block", marginTop: 16, color: "white" }}>
        Back to inventory →
      </a>
    </div>
  );
}
