import { CryptoPortfolio } from './crypto-portfolio'

const CoinsCreated = ({ heldOnly, createdOnly }: { heldOnly?: boolean, createdOnly?: boolean }) => {
    return (
        <CryptoPortfolio heldOnly={heldOnly} createdOnly={createdOnly} />
    )
}

export default CoinsCreated