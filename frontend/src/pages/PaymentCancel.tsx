import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PaymentCancel() {
  const navigate = useNavigate();

  useEffect(() => {
    // Immediately redirect to cart with failed parameter
    navigate("/cart?payment=failed");
  }, [navigate]);

  return null;
}
