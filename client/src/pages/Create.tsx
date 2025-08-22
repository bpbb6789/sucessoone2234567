
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Video, Camera, Mic, Image, FileText } from "lucide-react";

export default function Create() {
  const [uploadType, setUploadType] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // Simulate upload process
      setTimeout(() => {
        setIsUploading(false);
        console.log("File uploaded:", file.name);
      }, 2000);
    }
  };

  const createOptions = [
    {
      icon: Video,
      title: "Upload video",
      description: "Share your video with the world",
      type: "video"
    },
    {
      icon: Camera,
      title: "Create Short",
      description: "Make a quick vertical video",
      type: "short"
    },
    {
      icon: Mic,
      title: "Go live",
      description: "Stream live to your audience",
      type: "live"
    },
    {
      icon: Image,
      title: "Create post",
      description: "Share photos and updates",
      type: "post"
    }
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto" data-testid="page-create">
      <h1 className="text-2xl font-bold mb-6">Create</h1>

      {!uploadType ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {createOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                key={option.type}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setUploadType(option.type)}
              >
                <CardContent className="p-6 text-center">
                  <Icon className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                  <h3 className="text-lg font-semibold mb-2">{option.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{option.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploadType("")}
                className="mr-2"
              >
                ← Back
              </Button>
              {uploadType === "video" && "Upload Video"}
              {uploadType === "short" && "Create Short"}
              {uploadType === "live" && "Go Live"}
              {uploadType === "post" && "Create Post"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {uploadType === "video" && (
              <>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Drag and drop video files to upload</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Your videos will be private until you publish them.
                  </p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="video-upload"
                  />
                  <Button asChild>
                    <label htmlFor="video-upload" className="cursor-pointer">
                      SELECT FILES
                    </label>
                  </Button>
                </div>

                {isUploading && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="flex-1">
                        <div className="h-2 bg-blue-500 rounded-full" style={{ width: "60%" }}></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Uploading... 60%</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" placeholder="Add a title that describes your video" />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Tell viewers about your video"
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Visibility</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="unlisted">Unlisted</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gaming">Gaming</SelectItem>
                          <SelectItem value="tech">Technology</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {uploadType === "short" && (
              <div className="text-center">
                <Camera className="h-16 w-16 mx-auto mb-4 text-blue-500" />
                <h3 className="text-xl font-semibold mb-2">Create a Short</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Record a vertical video up to 60 seconds long
                </p>
                <Button size="lg">
                  <Camera className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
              </div>
            )}

            {uploadType === "live" && (
              <div className="text-center">
                <Mic className="h-16 w-16 mx-auto mb-4 text-red-500" />
                <h3 className="text-xl font-semibold mb-2">Go Live</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Stream live to your audience in real-time
                </p>
                <Button size="lg" className="bg-red-500 hover:bg-red-600">
                  <Mic className="h-5 w-5 mr-2" />
                  Start Streaming
                </Button>
              </div>
            )}

            {uploadType === "post" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="post-content">What's on your mind?</Label>
                  <Textarea
                    id="post-content"
                    placeholder="Share your thoughts..."
                    rows={4}
                  />
                </div>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                  <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Add photos to your post
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    id="image-upload"
                  />
                  <Button variant="outline" size="sm" asChild className="mt-2">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      Choose Images
                    </label>
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setUploadType("")}>
                Cancel
              </Button>
              <Button>
                {uploadType === "video" && "Upload Video"}
                {uploadType === "short" && "Create Short"}
                {uploadType === "live" && "Go Live"}
                {uploadType === "post" && "Publish Post"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
