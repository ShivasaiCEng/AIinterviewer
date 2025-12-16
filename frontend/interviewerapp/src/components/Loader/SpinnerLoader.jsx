import React from "react";

const SpinnerLoader = () => {
  return (
    <div className="flex items-center justify-center">
      {/* DaisyUI built-in spinner */}
      <span className="loading loading-spinner loading-sm text-orange-500"></span>
    </div>
  );
};

export default SpinnerLoader;
