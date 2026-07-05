'use client'

import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { defaultSiteContent } from "@/lib/defaultSiteContent";

const NewsLetter = ({ newsletter = defaultSiteContent.newsletter }) => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async () => {
    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await axios.post("/api/newsletter", { email });

      if (data.success) {
        toast.success(data.message);
        setEmail("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Failed to subscribe");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-2 pt-8 pb-14">
      <h1 className="md:text-4xl text-2xl font-medium">
        {newsletter.title}
      </h1>
      <p className="md:text-base text-gray-500/80 pb-8">
        {newsletter.description}
      </p>
      <div className="flex items-center justify-between max-w-2xl w-full md:h-14 h-12">
        <input
          className="border border-gray-500/30 rounded-md h-full border-r-0 outline-none w-full rounded-r-none px-3 text-gray-500"
          type="email"
          placeholder="Enter your email id"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSubscribe();
            }
          }}
        />
        <button
          onClick={() => void handleSubscribe()}
          disabled={submitting}
          className="md:px-12 px-8 h-full text-white bg-orange-600 rounded-md rounded-l-none disabled:opacity-70"
        >
          {submitting ? "Submitting..." : (newsletter.buttonText || "Subscribe")}
        </button>
      </div>
    </div>
  );
};

export default NewsLetter;
