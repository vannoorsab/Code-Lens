"""CodeLens RunFix - Pre-configured Demo Broken Projects.

Sets up realistic broken projects for instant demonstration of the complete
Detect -> Run -> Capture Error -> Diagnose -> Fix -> Test -> Verify loop.
"""

from __future__ import annotations

import json
import shutil
import tempfile
from pathlib import Path


def setup_broken_react_demo(target_dir: Path) -> Path:
    """Sets up a realistic broken React + Vite + TypeScript application."""
    target_dir.mkdir(parents=True, exist_ok=True)

    # 1. package.json
    pkg_json = {
        "name": "ecommerce-dashboard",
        "version": "1.0.0",
        "type": "module",
        "scripts": {
            "dev": "vite",
            "build": "tsc -b && vite build",
            "test": "vitest run"
        },
        "dependencies": {
            "react": "^18.3.1",
            "react-dom": "^18.3.1"
        },
        "devDependencies": {
            "typescript": "^5.4.5",
            "vite": "^5.2.11",
            "vitest": "^1.6.0"
        }
    }
    (target_dir / "package.json").write_text(json.dumps(pkg_json, indent=2), encoding="utf-8")

    # 2. tsconfig.json
    tsconfig = {
        "compilerOptions": {
            "target": "ES2020",
            "useDefineForClassFields": True,
            "lib": ["ES2020", "DOM", "DOM.Iterable"],
            "module": "ESNext",
            "skipLibCheck": True,
            "moduleResolution": "bundler",
            "allowImportingTsExtensions": True,
            "resolveJsonModule": True,
            "isolatedModules": True,
            "noEmit": True,
            "jsx": "react-jsx",
            "strict": True,
            "noUnusedLocals": True,
            "noUnusedParameters": True,
            "noFallthroughCasesInSwitch": True
        },
        "include": ["src"]
    }
    (target_dir / "tsconfig.json").write_text(json.dumps(tsconfig, indent=2), encoding="utf-8")

    # 3. Source files
    src_dir = target_dir / "src"
    src_dir.mkdir(parents=True, exist_ok=True)
    config_dir = src_dir / "config"
    config_dir.mkdir(parents=True, exist_ok=True)

    # The actual config module is located in src/config/index.ts
    (config_dir / "index.ts").write_text(
        "export const config = {\n"
        "  apiEndpoint: 'https://api.store.example.com',\n"
        "  timeout: 5000,\n"
        "  version: '2.1.0'\n"
        "};\n"
        "export default config;\n",
        encoding="utf-8"
    )

    # Deliberate Bug: src/api.ts imports './config' which fails resolution because bundler expects './config/index'
    (src_dir / "api.ts").write_text(
        "// API Client Module\n"
        "import config from \"./config\";\n\n"
        "export async function fetchProducts() {\n"
        "  const response = await fetch(`${config.apiEndpoint}/products`);\n"
        "  return response.json();\n"
        "}\n",
        encoding="utf-8"
    )

    (src_dir / "App.tsx").write_text(
        "import React from 'react';\n"
        "import { fetchProducts } from './api';\n\n"
        "export default function App() {\n"
        "  return (\n"
        "    <div className='app'>\n"
        "      <h1>Ecommerce Store</h1>\n"
        "    </div>\n"
        "  );\n"
        "}\n",
        encoding="utf-8"
    )

    (src_dir / "main.tsx").write_text(
        "import React from 'react';\n"
        "import ReactDOM from 'react-dom/client';\n"
        "import App from './App';\n\n"
        "ReactDOM.createRoot(document.getElementById('root')!).render(<App />);\n",
        encoding="utf-8"
    )

    return target_dir


def setup_broken_python_demo(target_dir: Path) -> Path:
    """Sets up a realistic broken Python + FastAPI application."""
    target_dir.mkdir(parents=True, exist_ok=True)

    (target_dir / "requirements.txt").write_text(
        "fastapi>=0.110.0\nuvicorn>=0.28.0\npytest>=8.0.0\n",
        encoding="utf-8"
    )

    app_dir = target_dir / "app"
    app_dir.mkdir(parents=True, exist_ok=True)

    (app_dir / "calculator.py").write_text(
        "def compute_discount(price: float, discount_rate: float) -> float:\n"
        "    return price * (1.0 - discount_rate)\n",
        encoding="utf-8"
    )

    # Bug in main.py: imports from 'calc' instead of 'calculator'
    (app_dir / "main.py").write_text(
        "from fastapi import FastAPI\n"
        "from app.calc import compute_discount  # Bug: module is app.calculator\n\n"
        "app = FastAPI(title='Pricing API')\n\n"
        "@app.get('/pricing')\n"
        "def get_price(base: float, rate: float):\n"
        "    return {'discounted': compute_discount(base, rate)}\n",
        encoding="utf-8"
    )

    return target_dir
