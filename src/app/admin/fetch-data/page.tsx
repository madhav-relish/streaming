"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ServiceSelector, selectedServices } from "./service-selector";

interface FetchProgress {
  status: "idle" | "running" | "completed" | "error";
  startTime: number | null;
  endTime: number | null;
  totalItems: number;
  processedItems: number;
  currentPage: number;
  totalPages: number;
  error: string | null;
  lastUpdated: number;
  services?: string[] | string;
}

export default function FetchDataPage() {
  const [country, setCountry] = useState("in");
  const [maxPages, setMaxPages] = useState("10");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [progress, setProgress] = useState<FetchProgress | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Function to format time duration
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Poll for progress updates
  const pollProgress = async () => {
    try {
      const response = await fetch('/api/admin/fetch-progress');
      if (response.ok) {
        const data = await response.json();
        setProgress(data);

        // If the operation is completed or errored, stop polling
        if (data.status === 'completed' || data.status === 'error') {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }

          // Update result message
          if (data.status === 'completed') {
            setResult({
              success: true,
              message: `Fetch completed successfully. Processed ${data.processedItems} items in ${formatDuration(data.endTime! - data.startTime!)}`
            });
          } else if (data.status === 'error') {
            setResult({
              success: false,
              message: `Error: ${data.error}`
            });
          }

          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Error polling for progress:", error);
    }
  };

  // Start polling when component mounts
  useEffect(() => {
    // Check if there's an ongoing operation
    pollProgress();

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  const handleFetchData = async () => {
    try {
      setIsLoading(true);
      setResult(null);

      // Build the query string with selected services
      let queryString = `/api/admin/fetch-all-content?country=${country}&maxPages=${maxPages}`;

      // Add selected services to the query if any are selected
      if (selectedServices.length > 0) {
        queryString += `&services=${selectedServices.join(',')}`;
      }

      const response = await fetch(queryString);
      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: data.message });
        setProgress(data.progress);

        // Start polling for progress updates
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }

        const interval = setInterval(pollProgress, 2000);
        setPollingInterval(interval);
      } else {
        setResult({ success: false, message: data.error || "An error occurred" });
        setIsLoading(false);
      }
    } catch (error) {
      setResult({ success: false, message: "An error occurred while fetching data" });
      setIsLoading(false);
    }
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!progress || progress.totalItems === 0) return 0;
    return Math.min(100, Math.round((progress.processedItems / progress.totalItems) * 100));
  };

  // Get elapsed time
  const getElapsedTime = () => {
    if (!progress || !progress.startTime) return "0s";
    const endTime = progress.endTime || Date.now();
    return formatDuration(endTime - progress.startTime);
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Admin: Fetch All Content</h1>
      <p className="text-muted-foreground mb-8">
        This page allows you to fetch all available content from the Rapid API and store it in the database.
        This is a long-running operation that may take several minutes to complete.
      </p>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Fetch Content</CardTitle>
          <CardDescription>
            Configure the fetch operation and click the button to start.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country Code</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g., in, us, gb"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              The country code to use for streaming availability (default: in for India)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPages">Maximum Pages</Label>
            <Input
              id="maxPages"
              type="number"
              value={maxPages}
              onChange={(e) => setMaxPages(e.target.value)}
              min="1"
              max="50"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              The maximum number of pages to fetch (each page contains 100 items)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Streaming Services</Label>
            <ServiceSelector isLoading={isLoading} />
            <p className="text-sm text-muted-foreground">
              Select one or more streaming services to fetch content from. Leave empty to fetch from all services.
            </p>
          </div>

          {/* Progress section */}
          {progress && progress.status === "running" && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress:</span>
                <span>{getProgressPercentage()}%</span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Page {progress.currentPage} of {progress.totalPages}</span>
                <span>{progress.processedItems} of {progress.totalItems} items</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Elapsed time: {getElapsedTime()}
              </div>
              {progress.services && (
                <div className="text-xs text-muted-foreground">
                  Services: {typeof progress.services === 'string'
                    ? progress.services
                    : progress.services.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Completed status */}
          {progress && progress.status === "completed" && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex items-center text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                <span className="font-medium">Fetch completed</span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Processed {progress.processedItems} items in {getElapsedTime()}
              </div>
              {progress.services && (
                <div className="mt-1 text-sm text-muted-foreground">
                  Services: {typeof progress.services === 'string'
                    ? progress.services
                    : progress.services.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Error status */}
          {progress && progress.status === "error" && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center text-red-700 dark:text-red-400">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Error occurred</span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {progress.error}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleFetchData}
            disabled={isLoading || progress?.status === "running"}
            className="w-full"
          >
            {isLoading || progress?.status === "running" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching Data...
              </>
            ) : (
              "Fetch All Content"
            )}
          </Button>
        </CardFooter>
      </Card>

      {result && !progress?.status && (
        <Alert className="mt-8" variant={result.success ? "default" : "destructive"}>
          <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      <div className="mt-8 text-sm text-muted-foreground">
        <p className="font-medium">Note:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>This operation will fetch all available content from the Rapid API and store it in the database.</li>
          <li>The process uses auto-pagination to fetch all available content for the selected services.</li>
          <li>The process runs in the background and will continue even if you navigate away from this page.</li>
          <li>You can return to this page at any time to check the progress.</li>
          <li>Be careful not to exceed your API rate limits by running this operation too frequently.</li>
          <li>The Rapid API has a limit of 1000 requests per month, so use this feature sparingly.</li>
        </ul>
      </div>
    </div>
  );
}
