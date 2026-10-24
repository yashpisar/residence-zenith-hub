import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, RefreshCw, Upload, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";

export function CameraCapture({ onCapture, label = "Visitor Photo" }) {
  const webcamRef = useRef(null);
  const [image, setImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [mirrored, setMirrored] = useState(true);
  const [flash, setFlash] = useState(false);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setImage(imageSrc);
        onCapture(imageSrc);
        setIsCameraActive(false);
      }
    }
  }, [webcamRef, onCapture]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        onCapture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">{label}</label>

      <div className="relative overflow-hidden rounded-xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center min-h-[240px] transition-all group">
        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white z-50 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {image ? (
          <div className="relative w-full h-full">
            <img src={image} alt="Captured" className="w-full h-[240px] object-cover" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 rounded-full shadow-lg"
              onClick={() => setImage(null)}
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : isCameraActive ? (
          <div className="relative w-full h-[240px] bg-black">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              mirrored={mirrored}
              className="w-full h-full object-cover"
            />

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => setMirrored(!mirrored)}
                className="rounded-full shadow-lg"
              >
                <RefreshCw className="size-4" />
              </Button>
              <Button onClick={capture} className="rounded-full px-6 shadow-lg">
                <Camera className="size-4 mr-2" />
                Capture
              </Button>
              <Button
                size="icon"
                variant="destructive"
                onClick={() => setIsCameraActive(false)}
                className="rounded-full shadow-lg"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="mx-auto size-12 bg-background rounded-full flex items-center justify-center mb-4 shadow-sm border border-border">
              <ImageIcon className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">Take a picture or upload an image</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => setIsCameraActive(true)} variant="outline" type="button">
                <Camera className="size-4 mr-2" />
                Webcam
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <Button variant="secondary" type="button">
                  <Upload className="size-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
