// frontend/src/components/ToastExample.tsx — [Frontend]
// {/* Example component showing how to use the error system */}

"use client";

import { useError } from "@/context/ErrorContext";
import { Button } from "@/components/ui/button";

export default function ToastExample() {
  const { showError, showSuccess, showWarning, showInfo, showToast, clearError } = useError();

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">Toast & Error System Demo</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <Button 
          onClick={() => showSuccess("Operation completed successfully!")}
          className="bg-green-600 hover:bg-green-700"
        >
          Show Success
        </Button>
        
        <Button 
          onClick={() => showError("Something went wrong!", "error", false)}
          className="bg-red-600 hover:bg-red-700"
        >
          Show Error
        </Button>
        
        <Button 
          onClick={() => showWarning("This is a warning message")}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Show Warning
        </Button>
        
        <Button 
          onClick={() => showInfo("Here's some useful information")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Show Info
        </Button>
        
        <Button 
          onClick={() => showToast("Quick toast notification", "success")}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Show Toast
        </Button>
        
        <Button 
          onClick={() => showError("This error persists until dismissed", "error", true)}
          className="bg-red-800 hover:bg-red-900"
        >
          Persistent Error
        </Button>
        
        <Button 
          onClick={clearError}
          className="bg-gray-600 hover:bg-gray-700"
        >
          Clear All Errors
        </Button>
      </div>
    </div>
  );
}
