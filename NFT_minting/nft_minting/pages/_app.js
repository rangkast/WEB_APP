import '../styles/globals.css'
import Link from 'next/link'

function Marketplace({ Component, pageProps }) {
  return (
    <div>
      <nav className="border-b p-6">
        <p className="text-4xl font-bold">Miya NFT Minting</p>
        <div className="flex mt-4">
          <Link href="/">
            <a className="mr-4 text-blue-500">
              Home
            </a>
          </Link>
          <Link href="/my-metamask">
            <a className="mr-6 text-blue-500">
              Connect to MetaMask
            </a>
          </Link>
          <Link href="/create-nft">
            <a className="mr-6 text-blue-500">
              Make NFT
            </a>
          </Link>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  )
}

export default Marketplace