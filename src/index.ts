// Composition root. Import order matters: MathJax must be configured before
// its <script> tag (loaded separately by the host page) evaluates, and the
// glossary table feature must run before the glossarize feature so the
// "glossary:updated" event it dispatches has a listener attached.
import "./mathjax/config";
import "./features/glossaryTable";
import "./features/glossarize";
import "./tooltip/lightbox";
import "./tooltip/tabs";
