import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axios.js";
import { Helmet } from "react-helmet-async";
import { Loader } from "lucide-react";

const GithubSetupPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Linking your GitHub account...");

  useEffect(() => {
    const linkInstallation = async () => {
      const installation_id = searchParams.get("installation_id");
      const state = searchParams.get("state"); // This is the user ID passed during connect

      if (!installation_id || !state) {
        setStatus("Error: Missing installation parameters from GitHub.");
        setTimeout(() => navigate("/reviews"), 3000);
        return;
      }

      try {
        await axiosInstance.post("/github/link-installation", {
          installation_id,
          state
        });
        
        setStatus("Successfully linked! Redirecting...");
        setTimeout(() => navigate("/reviews"), 1500);
      } catch (error) {
        console.error("Failed to link installation", error);
        setStatus("Failed to link installation. Please try again.");
        setTimeout(() => navigate("/reviews"), 3000);
      }
    };

    linkInstallation();
  }, [searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFBF7]">
      <Helmet>
        <title>Setup GitHub | HatMind AI</title>
      </Helmet>
      
      <div className="bg-white/60 p-12 rounded-[2.5rem] border border-greenDark/10 shadow-xl flex flex-col items-center">
        <Loader size={48} className="text-greenDark animate-spin mb-6" />
        <h2 className="text-2xl font-black text-greenDark mb-2">Almost there!</h2>
        <p className="text-greenDark/70 font-medium">{status}</p>
      </div>
    </div>
  );
};

export default GithubSetupPage;
