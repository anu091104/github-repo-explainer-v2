import { Folder, File } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RepoContentItem } from "@/types/analysis";

interface FolderStructureTableProps {
  contents: RepoContentItem[];
}

export function FolderStructureTable({ contents }: FolderStructureTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Folder structure</CardTitle>
      </CardHeader>
      <CardContent>
        {contents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No top-level contents available for this repository.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contents.map((item) => (
                <TableRow key={item.name}>
                  <TableCell className="flex items-center gap-2 font-mono text-xs">
                    {item.type === "dir" ? (
                      <Folder className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <File className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {item.name}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="capitalize">
                      {item.type}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
