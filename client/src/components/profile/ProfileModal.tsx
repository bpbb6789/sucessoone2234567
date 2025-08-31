import { useState, useEffect } from "react";
import { useAccount } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User, Settings, LogOut, Wallet } from "lucide-react";
import { Link } from "wouter";
import { useWallet } from "@/hooks/useWallet";

export default function ProfileModal() {
  const [open, setOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    description: "",
    avatarUrl: ""
  });
  const { address, isConnected } = useAccount();
  const { disconnect, shortenAddress } = useWallet();

  // Load profile data from localStorage
  useEffect(() => {
    if (address) {
      const savedProfile = localStorage.getItem(`profile_${address}`);
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile));
      }
    }
  }, [address]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          {profileData.avatarUrl ? (
            <img
              src={profileData.avatarUrl}
              alt="Profile"
              className="h-full w-full rounded-full object-cover"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {profileData.name ? profileData.name.charAt(0) : (address ? address.charAt(2) : 'U')}
              </span>
            </div>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </DialogTitle>
          <DialogDescription>
            View and edit your profile information.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            {profileData.avatarUrl ? (
              <img
                src={profileData.avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-full h-full flex items-center justify-center ${profileData.avatarUrl ? 'hidden' : ''}`}>
              <span className="text-white font-bold text-lg">
                {profileData.name ? profileData.name.charAt(0) : (address ? address.charAt(2) : 'U')}
              </span>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {profileData.name || shortenAddress(address || "")}
            </h3>
            <p className="text-sm text-gray-400">Connected Wallet</p>
          </div>
        </div>
        <div className="space-y-4 py-2">
          <div className="flex flex-col space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-white">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
              className="border border-gray-700 rounded-md p-2 bg-black text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label htmlFor="description" className="text-sm font-medium text-white">
              Description
            </label>
            <textarea
              id="description"
              value={profileData.description}
              onChange={(e) => setProfileData({...profileData, description: e.target.value})}
              className="border border-gray-700 rounded-md p-2 bg-black text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[100px]"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label htmlFor="avatarUrl" className="text-sm font-medium text-white">
              Avatar URL
            </label>
            <input
              id="avatarUrl"
              type="text"
              value={profileData.avatarUrl}
              onChange={(e) => setProfileData({...profileData, avatarUrl: e.target.value})}
              className="border border-gray-700 rounded-md p-2 bg-black text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (address) {
                localStorage.setItem(`profile_${address}`, JSON.stringify(profileData));
              }
              setOpen(false);
            }}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}