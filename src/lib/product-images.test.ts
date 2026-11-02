import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { validateImageFile } from "./product-images";

describe("validateImageFile", () => {
  it("accepts a 5 MB JPG", () => {
    expect(validateImageFile({ type: "image/jpeg", size: 5 * 1024 * 1024 })).toBeNull();
  });
  it("rejects images over 5 MB", () => {
    expect(validateImageFile({ type: "image/png", size: 5 * 1024 * 1024 + 1 })).not.toBeNull();
  });
  it("rejects non-image files", () => {
    expect(validateImageFile({ type: "application/pdf", size: 1000 })).not.toBeNull();
  });
});
