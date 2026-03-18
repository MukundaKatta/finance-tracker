"""CLI for finance-tracker."""
import sys, json, argparse
from .core import FinanceTracker

def main():
    parser = argparse.ArgumentParser(description="AI-powered personal finance tracker with FastAPI, React Native/Expo, and ML forecasting")
    parser.add_argument("command", nargs="?", default="status", choices=["status", "run", "info"])
    parser.add_argument("--input", "-i", default="")
    args = parser.parse_args()
    instance = FinanceTracker()
    if args.command == "status":
        print(json.dumps(instance.get_stats(), indent=2))
    elif args.command == "run":
        print(json.dumps(instance.track(input=args.input or "test"), indent=2, default=str))
    elif args.command == "info":
        print(f"finance-tracker v0.1.0 — AI-powered personal finance tracker with FastAPI, React Native/Expo, and ML forecasting")

if __name__ == "__main__":
    main()
