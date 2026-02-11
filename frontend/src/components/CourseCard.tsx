import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

interface CourseCardProps {
  course: {
    id: number;
    name: string;
    description: string;
    kitId?: number | null;
    difficulty?: string;
    categoryName?: string;
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      onClick={() => navigate(`/courses/${course.id}`)}
      className="bg-neutral-950 border-neutral-800 rounded-3xl overflow-hidden flex flex-col border-t-4 border-t-neutral-700 shadow-2xl cursor-pointer hover:border-t-white transition-all"
    >
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-white uppercase tracking-tight leading-tight">
          {course.name}
        </CardTitle>
        {(course.categoryName || course.difficulty) && (
          <div className="flex gap-2 mt-2">
            {course.categoryName && (
              <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-300 rounded">
                {course.categoryName}
              </span>
            )}
            {course.difficulty && (
              <span className="text-xs px-2 py-1 bg-purple-900/30 text-purple-300 rounded">
                {course.difficulty}
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between space-y-6">
        <p className="text-neutral-400 text-sm leading-relaxed">
          {course.description}
        </p>

        <div className="space-y-3 pt-4 border-t border-neutral-900">
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Required Hardware</p>
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/kits/${course.kitId}`);
            }}
            disabled={!course.kitId}
            className="w-full bg-black text-white border border-neutral-800 hover:bg-white hover:text-black font-black rounded-xl flex items-center justify-center gap-2 py-6 transition-all duration-300"
          >
            <Package className="w-5 h-5" />
            {course.kitId ? "GET LINKED KIT" : "NO KIT REQUIRED"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
