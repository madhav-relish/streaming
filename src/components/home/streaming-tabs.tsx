"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { streamingServices } from "@/lib/streaming-services";
import { Button } from "@/components/ui/button";

export function StreamingTabs() {
  // Define the major streaming services we want to show
  const majorServices = [
    "netflix",
    "prime",
    "hotstar",
    "disney",
    "sonyliv",
    "zee5",
    "jiocinema",
    "mxplayer",
  ];

  const [activeTab, setActiveTab] = useState(majorServices[0]);

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Streaming Services</h2>
        <Button variant="outline" asChild>
          <Link href="/streaming">View All</Link>
        </Button>
      </div>

      <Tabs defaultValue={majorServices[0]} value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 flex flex-wrap h-auto">
          {majorServices.map((service) => {
            const serviceInfo = streamingServices[service];

            return (
              <TabsTrigger
                key={service}
                value={service}
                className="flex items-center gap-2 py-2"
              >
                <div className="relative w-6 h-6">
                  <Image
                    src={serviceInfo?.logo || "/images/streaming/placeholder.svg"}
                    alt={serviceInfo?.name || service}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
                {serviceInfo?.name || service}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {majorServices.map((service) => (
          <TabsContent key={service} value={service} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium">{streamingServices[service]?.name || service} Content</h3>
              <Button variant="link" asChild>
                <Link href={`/streaming/${service}`}>
                  View All {streamingServices[service]?.name || service} Content
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-lg p-6 border">
                <h4 className="text-lg font-medium mb-2">Movies</h4>
                <p className="text-muted-foreground mb-4">
                  Explore the latest and greatest movies available on {streamingServices[service]?.name || service}.
                </p>
                <Button asChild>
                  <Link href={`/streaming/${service}/movies`}>Browse Movies</Link>
                </Button>
              </div>

              <div className="bg-card rounded-lg p-6 border">
                <h4 className="text-lg font-medium mb-2">TV Shows</h4>
                <p className="text-muted-foreground mb-4">
                  Discover popular TV shows streaming on {streamingServices[service]?.name || service}.
                </p>
                <Button asChild>
                  <Link href={`/streaming/${service}/tv-shows`}>Browse TV Shows</Link>
                </Button>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
