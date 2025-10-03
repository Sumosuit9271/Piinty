import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Beer, Camera, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AddPintDialogProps {
  open: boolean;
  onClose: () => void;
  fromMember: string;
  toMember: string;
  onConfirm: (note: string, photo?: string) => void;
}

export function AddPintDialog({
  open,
  onClose,
  fromMember,
  toMember,
  onConfirm,
}: AddPintDialogProps) {
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = async () => {
    setUploading(true);
    let photoUrl = "";

    try {
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('pint-photos')
          .upload(filePath, photoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('pint-photos')
          .getPublicUrl(filePath);

        photoUrl = publicUrl;
      }

      onConfirm(note, photoUrl);
      setNote("");
      setPhoto("");
      setPhotoFile(null);
      onClose();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setNote("");
    setPhoto("");
    setPhotoFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beer className="h-5 w-5 text-primary" />
            Add a Pint
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{fromMember}</span> owes{" "}
            <span className="font-medium text-foreground">{toMember}</span> a pint
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="note" className="text-sm font-medium">
              Reason (optional)
            </label>
            <Input
              id="note"
              placeholder="e.g., Lost the bet..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={100}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !photo) handleConfirm();
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Photo (optional)</label>
            {photo ? (
              <div className="relative">
                <img
                  src={photo}
                  alt="Pint photo"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => setPhoto("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={uploading}>
            Cancel
          </Button>
          <Button variant="add" onClick={handleConfirm} disabled={uploading}>
            {uploading ? "Uploading..." : "Add Pint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
