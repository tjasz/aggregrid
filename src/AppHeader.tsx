import packageJson from '../package.json'

export default function AppHeader() {
  return <div className="app-header">
    <h1><a href={packageJson.homepage}>{packageJson.name}</a></h1>
  </div>
}