const errorHandler = (err, req, res, next) => {

    if (err.stack.includes('Too many parts')) {
        res.status(400).send({error: 'Too many parts: You are limited to 1 file and 4 form field'})
        return
    }

    if (err.stack.includes('File too large')) {
        res.status(400).send({error: 'File too large: You are limited to 1 file of 10 MB max'})
        return
    }

    if (err.stack.includes('Too many files')) {
        res.status(400).send({error: 'Too many files: You are limited to ONLY 1 file of 10 MB max'})
        return
    }

    if (err.stack.includes('Unexpected field')) {
        res.status(400).send({error: "Unexpected field: You need to use 'picture' as a field name for your file"})
        return
    }

    res.status(500).send('Something broke!');
}

module.exports = errorHandler