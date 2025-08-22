"use client";
import CreateToken from "@/components/CreateToken";

export default function CreatePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#23234b] to-[#0f3460] py-20">
      <div className="w-full max-w-lg bg-zinc-900 rounded-2xl shadow-xl p-8 border border-zinc-800">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 text-center">Create a Meme Token</h1>
        <CreateToken>
          <button className="hidden" />
        </CreateToken>
      </div>
    </div>
  );
}
