import packageJson from '../package.json'

export default function AppFooter() {
  return <div className="app-footer">
    <p>&copy; 2024 Tyler Jaszkowiak, version {packageJson.version}</p>
  </div>
}