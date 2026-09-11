import { render, screen } from "@testing-library/react";
import { ErrorState, extractConsoleUrl } from "./ErrorState";

/** The shape Firestore actually throws when a composite index is missing. */
const INDEX_ERROR = new Error(
  "FAILED_PRECONDITION: The query requires an index. You can create it here: " +
    "https://console.firebase.google.com/v1/r/project/sublr-dev/firestore/indexes?create_composite=Ck9w"
);

describe("ErrorState", () => {
  it("announces itself as an alert with default copy", () => {
    render(<ErrorState />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Couldn't load this data");
  });

  it("renders custom copy", () => {
    render(<ErrorState title="Rates unavailable" description="Try again later." />);
    expect(screen.getByText("Rates unavailable")).toBeInTheDocument();
    expect(screen.getByText("Try again later.")).toBeInTheDocument();
  });

  it("shows the underlying message instead of swallowing it", () => {
    render(<ErrorState error={new Error("Missing or insufficient permissions.")} />);
    expect(screen.getByText(/Missing or insufficient permissions/)).toBeInTheDocument();
  });

  it("turns a Firestore index error into a link that creates the index", () => {
    render(<ErrorState error={INDEX_ERROR} />);
    const link = screen.getByRole("link", { name: /Create the missing index/ });
    expect(link).toHaveAttribute(
      "href",
      "https://console.firebase.google.com/v1/r/project/sublr-dev/firestore/indexes?create_composite=Ck9w"
    );
  });

  it("offers no link when the error carries no console URL", () => {
    render(<ErrorState error={new Error("network request failed")} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("extractConsoleUrl", () => {
  it("pulls the console URL out of Firestore's prose", () => {
    expect(extractConsoleUrl(INDEX_ERROR.message)).toBe(
      "https://console.firebase.google.com/v1/r/project/sublr-dev/firestore/indexes?create_composite=Ck9w"
    );
  });

  it("strips trailing punctuation the sentence leaves behind", () => {
    expect(
      extractConsoleUrl("create it here: https://console.firebase.google.com/project/x/indexes.")
    ).toBe("https://console.firebase.google.com/project/x/indexes");
  });

  it("returns null when there is no URL", () => {
    expect(extractConsoleUrl("permission denied")).toBeNull();
  });
});
