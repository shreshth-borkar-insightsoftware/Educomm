import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentNotificationProps {
  type: "success" | "failed";
  onClose: () => void;
  autoCloseDelay?: number;
}

export default function PaymentNotification({ 
  type, 
  onClose, 
  autoCloseDelay 
}: PaymentNotificationProps) {
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    if (autoCloseDelay && autoCloseDelay > 0) {
      // Auto-close timer
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      // Progress bar animation
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (autoCloseDelay / 50));
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, 50);
      
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [autoCloseDelay, onClose]);

  const isSuccess = type === "success";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div 
        className="relative max-w-md w-full mx-4 p-8 rounded-2xl border"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(20,20,20,0.9))",
          borderColor: isSuccess ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"
        }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          {isSuccess ? (
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-3">
          {isSuccess ? "PAYMENT SUCCESSFUL" : "VERIFICATION FAILED"}
        </h2>

        {/* Message */}
        <p className="text-gray-400 text-center mb-6">
          {isSuccess 
            ? "Your order has been placed successfully! Thank you for your purchase."
            : "Payment verification failed. Please try again or contact support."}
        </p>

        {/* Progress Bar - Only for success */}
        {isSuccess && autoCloseDelay && (
          <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-green-500 transition-all duration-50 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Action Button - Only show for failed payments */}
        {!isSuccess && (
          <Button 
            onClick={onClose}
            className="w-full bg-white text-black hover:bg-gray-200 font-semibold py-3"
          >
            BACK TO CART
          </Button>
        )}
      </div>
    </div>
  );
}
