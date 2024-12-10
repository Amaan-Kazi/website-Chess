import Image from "next/image";
import {Button} from "@/components/ui/button"

export default function Home() {
  return (
    <div className="">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold">Welcome to the Page</h1>
        <p>This is styled with ShadCN/UI themes.</p>
        <Button>Hello World</Button>
      </div>
    </div>
  );
}
