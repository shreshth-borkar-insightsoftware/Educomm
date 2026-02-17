import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/api/axiosInstance";
import { useCartStore } from "@/store/useCartStore";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart, fetchCart } = useCartStore();
  
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const hasProcessed = useRef(false);

  useEffect(() => {
    const verifyAndCreateOrder = async () => {
      const sessionId = searchParams.get("session_id");
      
      // Edge case: No session_id in URL, redirect to dashboard
      if (!sessionId) {
        console.log("[PAYMENT] No session_id found, redirecting to dashboard");
        navigate("/dashboard");
        return;
      }

      // Prevent double execution
      if (hasProcessed.current) {
        console.log("[PAYMENT] Already processed, skipping");
        return;
      }
      hasProcessed.current = true;

      try {
        console.log("[PAYMENT] Verifying session:", sessionId);
        
        // Verify the payment status with Stripe
        const verifyResponse = await api.get(`/payment/verify-session/${sessionId}`);
        
        console.log("[PAYMENT] Verification response:", verifyResponse.data);
        
        if (!verifyResponse.data.success) {
          setStatus("error");
          setErrorMessage("Payment verification failed. Please contact support.");
          return;
        }

        // Payment successful - webhook has already created the order
        console.log("[PAYMENT] Payment verified, order created by webhook");
        
        // Clear cart and localStorage
        clearCart();
        await fetchCart(); // Refetch to ensure cart is empty
        localStorage.removeItem("selectedAddress");
        
        // Show success state
        setStatus("success");
        
        // Redirect to orders page after a brief delay
        setTimeout(() => {
          navigate("/my-orders?payment=success");
        }, 2000);

      } catch (err: any) {
        console.error("[PAYMENT] Error during payment verification/order creation:", err);
        setStatus("error");
        setErrorMessage(
          err.response?.data?.message || 
          "An error occurred while processing your order. Please contact support with your payment confirmation."
        );
      }
    };

    verifyAndCreateOrder();
  }, [searchParams, clearCart, fetchCart, navigate]);

  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-neutral-800 border border-neutral-700 rounded-xl p-12 text-center">
          <Loader2 size={64} className="mx-auto mb-6 animate-spin text-white" />
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-3">
            Verifying Payment
          </h1>
          <p className="text-neutral-400 text-sm">
            Please wait while we confirm your payment...
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-neutral-800 border border-neutral-700 rounded-xl p-12 text-center">
          <XCircle size={64} className="mx-auto mb-6 text-red-500" />
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-3">
            Verification Failed
          </h1>
          <p className="text-neutral-400 text-sm mb-8">
            {errorMessage}
          </p>
          <Button
            onClick={() => navigate("/cart")}
            className="w-full bg-white text-black hover:bg-neutral-200 rounded-2xl font-black uppercase py-6"
          >
            Back to Cart
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-neutral-800 border border-neutral-700 rounded-xl p-12 text-center">
        <CheckCircle size={64} className="mx-auto mb-6 text-green-500" />
        <h1 className="text-2xl font-black uppercase tracking-tighter mb-3">
          Payment Successful!
        </h1>
        <p className="text-neutral-400 text-sm mb-8">
          Your order has been placed successfully. Thank you for your purchase!
        </p>
        <Button
          onClick={() => navigate("/my-orders")}
          className="w-full bg-white text-black hover:bg-neutral-200 rounded-2xl font-black uppercase py-6"
        >
          View My Orders
        </Button>
      </div>
    </div>
  );
}
