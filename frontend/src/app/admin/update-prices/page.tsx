"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

type UpdateLog = {
  timestamp: Date;
  message: string;
  type: "info" | "success" | "error";
};

export default function UpdatePricesPage() {
  const [skinId, setSkinId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<UpdateLog[]>([]);

  const addLog = (message: string, type: UpdateLog["type"] = "info") => {
    setLogs((prev) => [{ timestamp: new Date(), message, type }, ...prev].slice(0, 50));
  };

  const handleUpdateAll = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    setProgress(0);
    addLog("Starting update for all skins...", "info");

    try {
      const response = await apiFetch("/admin/update-skin-data", {
        method: "POST",
        body: JSON.stringify({}), // Empty body = update all
      });

      addLog(`Successfully started update: ${JSON.stringify(response)}`, "success");
      setProgress(100);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      addLog(`Error updating all skins: ${errMsg}`, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateSingle = async () => {
    if (isUpdating || !skinId) return;
    
    const id = parseInt(skinId);
    if (isNaN(id) || id <= 0) {
      addLog("Invalid Skin ID. Please enter a valid number.", "error");
      return;
    }

    setIsUpdating(true);
    setProgress(0);
    addLog(`Starting update for Skin ID: ${id}...`, "info");

    try {
      const response = await apiFetch("/admin/update-skin-data", {
        method: "POST",
        body: JSON.stringify({ skinIds: [id] }),
      });

      addLog(`Successfully updated Skin ID ${id}: ${JSON.stringify(response)}`, "success");
      setProgress(100);
      setSkinId(""); // Clear input after success
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      addLog(`Error updating Skin ID ${id}: ${errMsg}`, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-8 w-8" />
          Update Skin Prices
        </h1>
        <p className="text-muted-foreground">
          Manually trigger price updates using the SteamWebAPI. Use this when Render Cronjobs are not available.
        </p>
      </div>

      {/* Warning Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Render Cronjobs require a Premium plan. Use this admin panel to manually update prices when needed.
          Updates may take several minutes depending on the number of skins.
        </AlertDescription>
      </Alert>

      {/* Update All Skins */}
      <Card>
        <CardHeader>
          <CardTitle>Update All Skins</CardTitle>
          <CardDescription>
            Fetch the latest prices from SteamWebAPI for all skins in the database.
            This may take 5-10 minutes for large datasets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleUpdateAll}
            disabled={isUpdating}
            className="w-full"
            size="lg"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Updating All Skins...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Update All Skins
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Update Single Skin */}
      <Card>
        <CardHeader>
          <CardTitle>Update Single Skin</CardTitle>
          <CardDescription>
            Update a specific skin by its ID. Useful for quick fixes or testing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skinId">Skin ID</Label>
            <Input
              id="skinId"
              type="number"
              placeholder="e.g., 19829"
              value={skinId}
              onChange={(e) => setSkinId(e.target.value)}
              disabled={isUpdating}
            />
          </div>
          <Button
            onClick={handleUpdateSingle}
            disabled={isUpdating || !skinId}
            className="w-full"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Updating Skin {skinId}...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Update Skin
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      {isUpdating && (
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="w-full" />
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Update Logs</CardTitle>
          <CardDescription>
            Real-time status of price updates. Logs are limited to the last 50 entries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No logs yet. Start an update to see logs.</p>
            ) : (
              logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border flex items-start gap-2 ${
                    log.type === "success"
                      ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                      : log.type === "error"
                      ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                      : "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                  }`}
                >
                  {log.type === "success" && <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />}
                  {log.type === "error" && <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />}
                  {log.type === "info" && <RefreshCw className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {log.timestamp.toLocaleTimeString()}
                    </p>
                    <p className="text-sm break-words">{log.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

