import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { User, Edit } from "lucide-react"
import Profile from "./Profile"

interface ProfileModalProps {
    open?: boolean
    setOpen?: (open: boolean) => void
    children?: React.ReactNode
    trigger?: boolean
}

const ProfileModal = ({
    open,
    setOpen,
    children,
    trigger = false
}: ProfileModalProps) => {
    if (trigger && children) {
        return (
            <Dialog>
                <DialogTrigger asChild>
                    {children}
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
                    <Profile />
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                <Profile />
            </DialogContent>
        </Dialog>
    )
}

export default ProfileModal