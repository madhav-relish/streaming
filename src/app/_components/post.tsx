"use client";

import { useState } from "react";
import React from "react";

import { api } from "@/trpc/react";

type ShowProps = {
  title: string;
  overview: string;
  streamingOptions: { link: string }[];
};

const ShowCard: React.FC<ShowProps> = ({ title, overview, streamingOptions }) => {
  return (
    <div className="p-4 border rounded shadow-md bg-white">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-700 mb-4">{overview}</p>
      <ul className="list-disc pl-5">
        {streamingOptions.map((option, index) => (
          <li key={index}>
            <a href={option.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              Watch here
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export function LatestPost() {
	const [latestPost] = api.post.getLatest.useSuspenseQuery();

	const utils = api.useUtils();
	const [name, setName] = useState("");
	const createPost = api.post.create.useMutation({
		onSuccess: async () => {
			await utils.post.invalidate();
			setName("");
		},
	});

	return (
		<div className="w-full max-w-xs">
			{latestPost ? (
				<p className="truncate">Your most recent post: {latestPost.name}</p>
			) : (
				<p>You have no posts yet.</p>
			)}
			<form
				onSubmit={(e) => {
					e.preventDefault();
					createPost.mutate({ name });
				}}
				className="flex flex-col gap-2"
			>
				<input
					type="text"
					placeholder="Title"
					value={name}
					onChange={(e) => setName(e.target.value)}
					className="w-full rounded-full bg-white/10 px-4 py-2 text-white"
				/>
				<button
					type="submit"
					className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
					disabled={createPost.isPending}
				>
					{createPost.isPending ? "Submitting..." : "Submit"}
				</button>
			</form>
		</div>
	);
}

export default ShowCard;
