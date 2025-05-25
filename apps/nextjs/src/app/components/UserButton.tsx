"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import authClient from "@cued/auth/client";
import { Button } from "@cued/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@cued/ui/popover";

interface UserButtonProps {
  name: string;
  image: string;
}

const UserButton = ({ name, image }: UserButtonProps) => {
  const router = useRouter();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Image
          src={image}
          alt={name}
          width={28}
          height={28}
          className="border border-dashed border-primary transition-opacity hover:opacity-80 hover:grayscale"
        />
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="flex flex-col gap-2">
          <div className="line-clamp-1 font-medium">Welcome, {name}.</div>
          <Button
            variant="outline"
            onClick={() =>
              void authClient.signOut().then(() => {
                router.push("/");
              })
            }
          >
            Sign out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserButton;
