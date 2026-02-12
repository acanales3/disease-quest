// plugins/pdfmake.client.ts
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

export default defineNuxtPlugin(() => {
  if (typeof window !== "undefined") {
    // The pdfFonts object itself IS the vfs (contains .ttf files)
    const vfs = pdfFonts as any;

    if (vfs && typeof vfs === "object" && Object.keys(vfs).length > 0) {
      (pdfMake as any).vfs = vfs;

      // Also configure font definitions for Roboto
      (pdfMake as any).fonts = {
        Roboto: {
          normal: "Roboto-Regular.ttf",
          bold: "Roboto-Medium.ttf",
          italics: "Roboto-Italic.ttf",
          bolditalics: "Roboto-MediumItalic.ttf",
        },
      };

      console.log(
        "[pdfMake Plugin] ✅ vfs loaded successfully with fonts:",
        Object.keys(vfs),
      );
      console.log(
        "[pdfMake Plugin] ✅ font definitions configured:",
        (pdfMake as any).fonts,
      );
    } else {
      console.error("[pdfMake Plugin] ❌ pdfFonts is empty or invalid", {
        type: typeof pdfFonts,
        keys: pdfFonts ? Object.keys(pdfFonts) : "null",
      });
    }
  }
});
