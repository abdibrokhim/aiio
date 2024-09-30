'use client'

// File: /pages/index.js

import { useState } from "react";

export default function TestPage() {
  // State variables for the evaluation feature (from previous implementation)
  const [prompt, setPrompt] = useState("");
  const [userAGuess, setUserAGuess] = useState("");
  const [userBGuess, setUserBGuess] = useState("");
  const [evaluationGrades, setEvaluationGrades] = useState(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");

  // State variables for the sound generation feature
  const [soundText, setSoundText] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("");
  const [promptInfluence, setPromptInfluence] = useState("");
  const [audioSrc, setAudioSrc] = useState("");
  const [soundLoading, setSoundLoading] = useState(false);
  const [soundError, setSoundError] = useState("");

  // State variables for the image generation feature
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");

  // State variables for Sound Descriptor Generation
  const [eventText, setEventText] = useState("");
  const [soundDescriptors, setSoundDescriptors] = useState(null);
  const [descriptorLoading, setDescriptorLoading] = useState(false);
  const [descriptorError, setDescriptorError] = useState("");

  // Handler for evaluating guesses
  const handleEvaluate = async (e: any) => {
    e.preventDefault(); // Prevent page reload
    setEvaluationLoading(true);
    setEvaluationError("");
    setEvaluationGrades(null);

    // Input validation
    if (!prompt.trim() || !userAGuess.trim() || !userBGuess.trim()) {
      setEvaluationError("All fields are required.");
      setEvaluationLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          userA: userAGuess.trim(),
          userB: userBGuess.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setEvaluationError(data.error?.message || "An error occurred.");
      } else {
        setEvaluationGrades(data.grades);
      }
    } catch (err) {
      setEvaluationError("Failed to connect to the server.");
    } finally {
      setEvaluationLoading(false);
    }
  };

  // Handler for generating sound effects
  const handleGenerateSound = async (e: any) => {
    e.preventDefault(); // Prevent page reload
    setSoundLoading(true);
    setSoundError("");
    setAudioSrc("");

    // Input validation
    if (!soundText.trim() || !soundDescriptors) {
      setSoundError("The 'Text' field is required.");
      setSoundLoading(false);
      return;
    }

    // Prepare the payload
    const payload = {
      text: soundText.trim(),
      durationSeconds: 5,
      promptInfluence: 0.5,
    };

    if (durationSeconds) {
      const duration = parseFloat(durationSeconds);
      if (isNaN(duration) || duration < 0.5 || duration > 22) {
        setSoundError("'Duration Seconds' must be a number between 0.5 and 22.");
        setSoundLoading(false);
        return;
      }
      payload.durationSeconds = duration;
    }

    if (promptInfluence) {
      const influence = parseFloat(promptInfluence);
      if (isNaN(influence) || influence < 0 || influence > 1) {
        setSoundError("'Prompt Influence' must be a number between 0 and 1.");
        setSoundLoading(false);
        return;
      }
      payload.promptInfluence = influence;
    }

    try {
      const response = await fetch("/api/generateAudio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setSoundError(data.error?.message || "An error occurred.");
      } else {
        // Create a Blob from the base64 string
        const audioBlob = new Blob([Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioSrc(audioUrl);
      }
    } catch (err) {
      setSoundError("Failed to connect to the server.");
    } finally {
      setSoundLoading(false);
    }
  };

  // Handler for generating images
  const handleGenerateImage = async (e: any) => {
    e.preventDefault(); // Prevent page reload
    setImageLoading(true);
    setImageError("");
    setImageUrl(null);

    // Input validation
    if (!imagePrompt.trim()) {
      setImageError("The 'Image Prompt' field is required.");
      setImageLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/generateImage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: imagePrompt.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setImageError(data.error?.message || "An error occurred.");
      } else {
        console.log('image: ', data.imageUrl);
        setImageUrl(data.imageUrl);
      }
    } catch (err) {
      setImageError("Failed to connect to the server.");
    } finally {
      setImageLoading(false);
    }
  };

  // Handler for generating sound descriptors
  const handleGenerateDescriptors = async (e: any) => {
    e.preventDefault(); // Prevent page reload
    setDescriptorLoading(true);
    setDescriptorError("");
    setSoundDescriptors(null);

    // Input validation
    if (!eventText.trim()) {
      setDescriptorError("The 'Event Text' field is required.");
      setDescriptorLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/soundEffect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventText: eventText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDescriptorError(data.error?.message || "An error occurred.");
      } else {
        setSoundDescriptors(data.descriptors.replace(/"/g, ""));
        // Optionally, send these descriptors to your AI Voice Generative AI here
        // let's send the descriptors to the AI Voice Generative AI
        setTimeout(() => {
          handleGenerateSound({
            preventDefault: () => {},
          });
        }, 2000);
      }
    } catch (err) {
      setDescriptorError("Failed to connect to the server.");
    } finally {
      setDescriptorLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <main className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Harmony Quest Evaluator & Sound Generator</h1>

        {/* Evaluation Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Evaluate User Guesses</h2>
          <form onSubmit={handleEvaluate} className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
                Original Prompt
              </label>
              <textarea
                id="prompt"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter the original prompt..."
                required
              ></textarea>
            </div>

            <div>
              <label htmlFor="userA" className="block text-sm font-medium text-gray-700">
                User A Guess
              </label>
              <input
                type="text"
                id="userA"
                value={userAGuess}
                onChange={(e) => setUserAGuess(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter User A's guess..."
                required
              />
            </div>

            <div>
              <label htmlFor="userB" className="block text-sm font-medium text-gray-700">
                User B Guess
              </label>
              <input
                type="text"
                id="userB"
                value={userBGuess}
                onChange={(e) => setUserBGuess(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter User B's guess..."
                required
              />
            </div>

            {evaluationError && (
              <div className="text-red-500 text-sm">
                {evaluationError}
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                evaluationLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={evaluationLoading}
            >
              {evaluationLoading ? "Evaluating..." : "Evaluate Guesses"}
            </button>
          </form>

          {evaluationGrades && (
            <div className="mt-6 p-4 bg-green-100 border border-green-200 rounded-md">
              <h3 className="text-lg font-semibold mb-2">Evaluation Results</h3>
              <p>User A Grade: <span className="font-bold">{evaluationGrades[0]}</span> / 10</p>
              <p>User B Grade: <span className="font-bold">{evaluationGrades[1]}</span> / 10</p>
            </div>
          )}
        </section>

        {/* Sound Generation Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Generate Sound Effects</h2>
          <form onSubmit={handleGenerateSound} className="space-y-4">
            <div>
              <label htmlFor="soundText" className="block text-sm font-medium text-gray-700">
                Text Description
              </label>
              <input
                type="text"
                id="soundText"
                value={soundText}
                onChange={(e) => setSoundText(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., bird singing at the street at night"
                required
              />
            </div>

            <div>
              <label htmlFor="durationSeconds" className="block text-sm font-medium text-gray-700">
                Duration (Seconds)
              </label>
              <input
                type="number"
                step="0.1"
                id="durationSeconds"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Optional: 5.0"
                min="0.5"
                max="22"
              />
            </div>

            <div>
              <label htmlFor="promptInfluence" className="block text-sm font-medium text-gray-700">
                Prompt Influence
              </label>
              <input
                type="number"
                step="0.1"
                id="promptInfluence"
                value={promptInfluence}
                onChange={(e) => setPromptInfluence(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Optional: 0.5"
                min="0"
                max="1"
              />
              <p className="text-xs text-gray-500 mt-1">0 to 1. Higher values make the generation follow the prompt more closely.</p>
            </div>

            {soundError && (
              <div className="text-red-500 text-sm">
                {soundError}
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                soundLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={soundLoading}
            >
              {soundLoading ? "Generating..." : "Generate Sound Effect"}
            </button>
          </form>

          {audioSrc && (
            <div className="mt-6 p-4 bg-blue-100 border border-blue-200 rounded-md">
              <h3 className="text-lg font-semibold mb-2">Generated Sound Effect</h3>
              <audio controls src={audioSrc} className="w-full">
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </section>

        {/* Image Generation Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Generate Image</h2>
          <form onSubmit={handleGenerateImage} className="space-y-4">
            <div>
              <label htmlFor="imagePrompt" className="block text-sm font-medium text-gray-700">
                Image Prompt
              </label>
              <input
                type="text"
                id="imagePrompt"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                placeholder="e.g., A serene mountain landscape at sunrise with mist rolling over the peaks."
                required
              />
            </div>

            {imageError && (
              <div className="text-red-500 text-sm">
                {imageError}
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-2 px-4 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                imageLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={imageLoading}
            >
              {imageLoading ? "Generating Image..." : "Generate Image"}
            </button>
          </form>

          {imageUrl && (
            <div className="mt-6 p-4 bg-purple-100 border border-purple-200 rounded-md">
              <h3 className="text-lg font-semibold mb-2">Generated Image</h3>
              <img src={imageUrl} alt="Generated" className="w-full max-w-md rounded-md shadow-md" />
            </div>
          )}
        </section>

        {/* Sound Descriptor Generation Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Generate Sound Descriptors</h2>
          <form onSubmit={handleGenerateDescriptors} className="space-y-4">
            <div>
              <label htmlFor="eventText" className="block text-sm font-medium text-gray-700">
                Event Text
              </label>
              <input
                type="text"
                id="eventText"
                value={eventText}
                onChange={(e) => setEventText(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., Game ended"
                required
              />
            </div>

            {descriptorError && (
              <div className="text-red-500 text-sm">
                {descriptorError}
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                descriptorLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={descriptorLoading}
            >
              {descriptorLoading ? "Generating..." : "Generate Descriptors"}
            </button>
          </form>

          {soundDescriptors && (
            <div className="mt-6 p-4 bg-yellow-100 border border-yellow-200 rounded-md">
              <h3 className="text-lg font-semibold mb-2">Generated Sound Descriptors</h3>
              <p>{soundDescriptors}</p>
              {/* Optionally, add a button to trigger the AI Voice Generative AI with these descriptors */}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
